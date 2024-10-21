/**********************************************/
/* BEGIN interface for structure SHAPE constraints */
/**********************************************/

  
%extend vrna_fold_compound_t {

#ifdef SWIGPYTHON
%feature("autodoc") sc_add_SHAPE_deigan;
%feature("kwargs") sc_add_SHAPE_deigan;
%feature("autodoc") sc_add_SHAPE_deigan_ali;
%feature("kwargs") sc_add_SHAPE_deigan_ali;
%feature("autodoc") sc_add_SHAPE_zarringhalam;
%feature("kwargs") sc_add_SHAPE_zarringhalam;
%feature("autodoc") sc_add_SHAPE_eddy_2;
%feature("kwargs") sc_add_SHAPE_eddy_2;
#endif

  int
  sc_add_SHAPE_deigan(std::vector<double> reactivities,
                      double              m,
                      double              b,
                      unsigned int        options = VRNA_OPTION_DEFAULT)
  {
    return vrna_sc_add_SHAPE_deigan($self, (const double *)&reactivities[0], m, b, options);
  }

  int
  sc_add_SHAPE_deigan_ali(std::vector<string> shape_files,
                          std::vector<int>    shape_file_association,
                          double              m,
                          double              b,
                          unsigned int        options = VRNA_OPTION_DEFAULT)
  {
    std::vector<const char*>  vc;
    transform(shape_files.begin(), shape_files.end(), back_inserter(vc), convert_vecstring2veccharcp);
    vc.push_back(NULL); /* mark end of vector */
    shape_file_association.push_back(-1); /* mark end of vector */
    return vrna_sc_add_SHAPE_deigan_ali($self, (const char **) &vc[0], (const int *) &shape_file_association[0], m, b, options);
  }

  int
  sc_add_SHAPE_zarringhalam(std::vector<double> reactivities,
                            double              b,
                            double              default_value,
                            const char          *shape_conversion,
                            unsigned int        options = VRNA_OPTION_DEFAULT)
  {
    return vrna_sc_add_SHAPE_zarringhalam($self, (const double *) &reactivities[0], b, default_value, shape_conversion, options);
  }

  int
  sc_add_SHAPE_eddy_2(std::vector<double> reactivities,
                      std::vector<double> unpaired_data,
                      std::vector<double> paired_data)
  {
    return vrna_sc_add_SHAPE_eddy_2($self, (const double *)&reactivities[0], unpaired_data.size(), (const double *)&unpaired_data[0], paired_data.size(), (const double *)&paired_data[0]);
  }
}

%include  <ViennaRNA/probing/SHAPE.h>
